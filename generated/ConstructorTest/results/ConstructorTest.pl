use strict;
use warnings;

package ConstructorTest;

sub new
{
    my $class = shift;
    my $self = {};
    bless $self, $class;
    my ( $field1 ) = @_;
    $self->{field1} = $field1;
    $self->{field2} = $field1 * $self->{field1} * 5;
    return $self;
}

package TestClass;

sub new
{
    my $class = shift;
    my $self = {};
    bless $self, $class;
    return $self;
}

sub test_method {
    my ( $self ) = @_;
    my $test = new ConstructorTest(3);
    print(($test->{field2}) . "\n");
}

package Program;

eval {
    my $c = new TestClass();
    $c->test_method();
};
if ($@) {
    print "Exception: " . $@
}