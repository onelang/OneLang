use strict;
use warnings;

package MapX;

sub new
{
    my $class = shift;
    my $self = {};
    bless $self, $class;
    return $self;
}

sub set {
    my ( $self, $key, $value ) = @_;
    $self->{value} = $value;
}

sub get {
    my ( $self, $key ) = @_;
    return $self->{value};
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
    my $map_x = new MapX();
    $map_x->set("hello", 3);
    my $num_value = $map_x->get("hello2");
    print(("@{[$num_value]}") . "\n");
}

package Program;

eval {
    my $c = new TestClass();
    $c->test_method();
};
if ($@) {
    print "Exception: " . $@
}