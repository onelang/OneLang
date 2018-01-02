use strict;
use warnings;

package TokenType;

sub new
{
    my $class = shift;
    my $self = {};
    bless $self, $class;
    return $self;
}

our $end_token = "EndToken";
our $whitespace = "Whitespace";
our $identifier = "Identifier";
our $operator_x = "Operator";
our $no_initializer;

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
    my $casing_test = $TokenType::end_token;
    return $casing_test;
}

package Program;

eval {
    my $c = new TestClass();
    $c->test_method();
};
if ($@) {
    print "Exception: " . $@
}